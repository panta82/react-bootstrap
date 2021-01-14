import { graphql } from 'gatsby';
import kebabCase from 'lodash/kebabCase';
import React from 'react';
import sortBy from 'lodash/sortBy';
import Anchor from './Anchor';
import Heading from './Heading';
import ImportApi from './ImportApi';
import LinkToSource from './LinkToSource';
import PropTable from './PropTable';

const propTypes = {};

function ComponentApi({ heading, metadata, exportedBy }) {
  let { description, displayName: name } = metadata;
  let descHtml = description && description.childMarkdownRemark.html;
  let importName = name;

  if (exportedBy) {
    name = `${exportedBy.displayName}.${name
      .split(exportedBy.displayName)
      .pop()}`;
    importName = exportedBy.displayName;
  }

  const id = `${kebabCase(name)}-props`;

  const args = {};
  sortBy(metadata.props, (prop) =>
    prop.name.startsWith('bs') ? 'zzzzzz' : prop.name,
  )
    .filter(
      (prop) => prop.type && !prop.doclets.private && !prop.doclets.ignore,
    )
    .forEach((propData) => {
      // propData format:
      // {
      //   "name": "onClose",
      //   "doclets": [
      //   {
      //     "tag": "controllable",
      //     "value": "show"
      //   }
      // ],
      //   "defaultValue": null,
      //   "description": {
      //   "text": "Callback fired when alert is closed.",
      //     "childMarkdownRemark": {
      //     "html": "<p>Callback fired when alert is closed.</p>"
      //   }
      // },
      //   "required": false,
      //   "type": {
      //   "name": "func",
      //     "value": null,
      //     "raw": null
      // }
      // }

      // Result format:
      // https://storybook.js.org/docs/react/api/argtypes

      // eslint-disable-next-line no-multi-assign
      const arg = (args[propData.name] = {
        name: propData.name,
        type: {
          name: propData.type.name,
          required: propData.required,
        },
        description: propData.description.text,
      });

      if (/'(?:[a-zA-Z0-9$]+' \|)+/.test(arg.type.name)) {
        // We are dealing with an "enum" / algebraic OR type. Convert to string + enum.
        const items = arg.type.name
          .split('|')
          .map((x) => x.trim().replace(/^'(.*)'$/, '$1'));
        arg.control = {
          type: 'select',
          options: items,
        };
        arg.type.name = 'enum';
      }
    });

  return (
    <>
      <Heading h={heading || '3'} id={id} title={name} className="my-3">
        <div className="d-flex align-items-center">
          <Anchor target={id}>
            <span className="text-monospace">{name}</span>
          </Anchor>

          <span className="ml-auto" />
          <LinkToSource component={importName} />
        </div>
      </Heading>

      <ImportApi name={importName} />
      {/* use composes here */}
      {/* eslint-disable-next-line react/no-danger */}
      {descHtml && <div dangerouslySetInnerHTML={{ __html: descHtml }} />}
      <PropTable metadata={metadata} />

      <h4>Story args</h4>
      <pre>{JSON.stringify(args, null, '  ')}</pre>
    </>
  );
}

ComponentApi.propTypes = propTypes;

export default ComponentApi;

export const metadataFragment = graphql`
  fragment ComponentApi_metadata on ComponentMetadata {
    composes
    displayName
    description {
      text
      internal {
        content
      }
      childMarkdownRemark {
        html
      }
    }
    ...PropTable_metadata
  }
`;
